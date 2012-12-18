$(document).ready(function(){
	
	// desabilita links com href=# para não irem ao topo da página
	$(document).on("click", "a[href='#']", function(event) {
	   event.preventDefault();
	});
				
	
	
    //{{{ INICIO HISTORICO MÓDULO  - guarda histórico de navegação para voltar no último módulo aberto
	// lê parâmetro passado via querystring - url da barra de endereços
	var querystring = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&').toString();
	//se foi passado parâmetro, exibe categoria correspondente
	if(querystring.indexOf("mod") >= 0){ 
		var index_modulo = parseInt(querystring.split("mod=")[1],10);
		$("#menu_categoria a[name='mod"+index_modulo+"']").addClass("selecionado")
														  .after("<div class='seta_grande_categorias'><span>Item selecionado</span></div>");
		$(".tabela_wrapper[id='mod"+index_modulo+"']").fadeIn("fast");
	}	
	// se não, seleciona primeiro item do menu de categorias e mostra texto de início do tutorial
	else {
		$("#menu_categoria a:first").addClass("selecionado")
									 .after("<div class='seta_grande_categorias'><span>Item selecionado</span></div>");
		$(".tabela_wrapper:first").fadeIn("fast");
		//inicioTutorial();
	}	
	//FIM HISTORICO MÓDULO }}}
	
	// clique no menu de categorias
	$(document).on("click", "#menu_categoria ul li a", function() {
		$("#menu_categoria a").removeClass("selecionado");
		$(this).addClass("selecionado");
		
		$(".seta_grande_categorias").remove();
		$(this).after("<div class='seta_grande_categorias'><span>Item selecionado</span></div>");
		
		$(".tabela_wrapper").hide();
		$("#"+$(this).attr("name")).fadeIn("fast");
	});
	
	
	//{{{ INICIO SOLUÇÃO PARA MESCLAR TÓPICOS
	// mescla as linhas dos tópicos quando elas se repetem
	function mesclaTopicosInicial() {
		var classe_linha_topico = "topico_odd";
		$(".tabela_wrapper td:nth-child(1)").each(function(i){
			if(i==0){nome_topico_default = "";}
			if ($(this).text() != nome_topico_default) {
				nome_topico_default = $(this).text();
				$(this).css("color","");
				$(".tabela_wrapper td:nth-child(1)").eq(i-1).css("border-bottom", "");
				//$("body").prepend($(this).parent().index());
				if($(this).parent().index()==0) {
					classe_linha_topico = "";
				}
				else {
					if(classe_linha_topico=="") { classe_linha_topico = "topico_odd"; }
					else if(classe_linha_topico=="topico_odd") { classe_linha_topico = ""; }
				}
				$(this).parent().addClass(classe_linha_topico);
			}
			else {
				$(this).parent().addClass(classe_linha_topico);
				$(this).css("color",$(this).css('backgroundColor'));
				$(".tabela_wrapper td:nth-child(1)").eq(i-1).css("border-bottom", "1px solid transparent");
			}
		});
	}
	
	// mescla as linhas dos tópicos quando elas se repetem (função chamada quando há alteração no campo de busca)
	function mesclaTopicos(index_tabela) {
		$(".tabela_wrapper:eq("+index_tabela+") td:nth-child(1)").each(function(i){
			if(i==0){nome_topico_default = "";}
			//$("body").prepend(nome_topico_default+" ");
			if ($(this).text() != nome_topico_default) {
				nome_topico_default = $(this).text();
				$(this).css("color","");
				$(".tabela_wrapper:eq("+index_tabela+") td:nth-child(1)").eq(i-1).css("border-bottom", "");
			}
			else {
				$(this).css("color",$(this).css('backgroundColor'));
				if($(this).text() == $(".tabela_wrapper:eq("+index_tabela+") td:nth-child(1)").eq(i).text()){
					$(".tabela_wrapper:eq("+index_tabela+") td:nth-child(1)").eq(i-1).css("border-bottom", "1px solid transparent");
				}
			}
		});
		//$("body").prepend("<br/>");
	}
	
	// chama a função no carregamento da página
	mesclaTopicosInicial();
	
	// chama a função mesclaTopicos a cada alteração no campo de busca
	$(document).on("keyup change",".dataTables_filter input", function(){
		var index_tabela = $(this).parents().filter(".tabela_wrapper").index() - 1;
		mesclaTopicos(index_tabela);
		//$("body").prepend(index_tabela+" ");
	});
	
	//FIM SOLUÇÃO PARA MESCLAR TÓPICOS }}}
	
	

	
});	